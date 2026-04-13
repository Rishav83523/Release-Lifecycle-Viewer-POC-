package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var mongoClient *mongo.Client

type Release struct {
	ID          string `bson:"_id,omitempty" json:"id,omitempty"`
	FileName    string `bson:"fileName" json:"fileName"`
	FileSize    int64  `bson:"fileSize" json:"fileSize"`
	Version     string `bson:"version" json:"version"`
	Description string `bson:"description" json:"description"`
	UploadedAt  time.Time `bson:"uploadedAt" json:"uploadedAt"`
}

type ResponseMessage struct {
	Message string `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func init() {
	var err error
	mongoClient, err = mongo.Connect(context.Background(), options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal("MongoDB connection failed:", err)
	}

	err = mongoClient.Ping(context.Background(), nil)
	if err != nil {
		log.Fatal("MongoDB ping failed:", err)
	}

	log.Println("Connected to MongoDB")
}

func uploadReleaseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	err := r.ParseMultipartForm(10 << 20) // 10 MB max upload size
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ResponseMessage{Error: "Failed to parse form"})
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ResponseMessage{Error: "No file provided"})
		return
	}
	defer file.Close()

	version := r.FormValue("version")
	description := r.FormValue("description")

	if version == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ResponseMessage{Error: "Version is required"})
		return
	}

	// Read file content
	fileData, err := io.ReadAll(file)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ResponseMessage{Error: "Failed to read file"})
		return
	}

	// Save to MongoDB
	collection := mongoClient.Database("release_manager").Collection("releases")
	release := Release{
		FileName:    handler.Filename,
		FileSize:    int64(len(fileData)),
		Version:     version,
		Description: description,
		UploadedAt:  time.Now(),
	}

	result, err := collection.InsertOne(context.Background(), release)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ResponseMessage{Error: "Failed to save release"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ResponseMessage{
		Message: "Release uploaded successfully",
		Data: map[string]interface{}{
			"id":          result.InsertedID,
			"fileName":    release.FileName,
			"version":     release.Version,
			"fileSize":    release.FileSize,
			"uploadedAt":  release.UploadedAt,
		},
	})
}

func getReleases(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	collection := mongoClient.Database("release_manager").Collection("releases")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ResponseMessage{Error: "Failed to fetch releases"})
		return
	}
	defer cursor.Close(context.Background())

	var releases []Release
	if err = cursor.All(context.Background(), &releases); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ResponseMessage{Error: "Failed to decode releases"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ResponseMessage{
		Message: "Releases fetched successfully",
		Data:    releases,
	})
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ResponseMessage{Message: "API is healthy"})
}

func main() {
	defer mongoClient.Disconnect(context.Background())

	router := mux.NewRouter()

	// Routes
	router.HandleFunc("/api/releases/upload", uploadReleaseHandler).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/releases", getReleases).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/health", healthCheckHandler).Methods("GET")

	// CORS middleware
	router.Use(corsMiddleware)

	port := ":8000"
	log.Printf("Server running on http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, router))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
