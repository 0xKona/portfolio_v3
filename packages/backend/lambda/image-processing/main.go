package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	tableName  = os.Getenv("TABLE_NAME")
	bucketName = os.Getenv("BUCKET_NAME")
	dbClient   *dynamodb.Client
	s3Client   *s3.Client
)

// handler processes S3 event notifications. Each record represents one new
// object in raw/<projectId>/original.<ext>. We process them sequentially
// since Lambda typically receives one record per invocation for S3 events.
func handler(ctx context.Context, event events.S3Event) error {
	for _, record := range event.Records {
		key := record.S3.Object.Key
		if err := processImage(ctx, key); err != nil {
			return fmt.Errorf("failed to process %s: %w", key, err)
		}
	}
	return nil
}

func main() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("unable to load AWS config: %v", err))
	}
	dbClient = dynamodb.NewFromConfig(cfg)
	s3Client = s3.NewFromConfig(cfg)
	lambda.Start(handler)
}
