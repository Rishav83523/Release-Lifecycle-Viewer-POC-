package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	DBClient            *mongo.Client
	ReleasesCollection  *mongo.Collection
)

func Init() {
	// Load .env file (optional, won't fail if not found)
	_ = godotenv.Load()

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	DBClient = client
	ReleasesCollection = client.Database("pac-timeline").Collection("releases")

	// Create unique index on contentHash to prevent duplicate content
	indexModel := mongo.IndexModel{
		Keys: bson.D{bson.E{Key: "contentHash", Value: 1}},
		Options: options.Index().SetUnique(true).SetSparse(true),
	}
	_, err = ReleasesCollection.Indexes().CreateOne(ctx, indexModel)
	if err != nil {
		log.Printf("⚠️  Warning: Failed to create contentHash index: %v", err)
	}

	log.Println("✅ Connected to MongoDB")
}

func Close() error {
	return DBClient.Disconnect(context.Background())
}
