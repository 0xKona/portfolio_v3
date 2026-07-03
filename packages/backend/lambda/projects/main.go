package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

// Shared state — initialised once at cold start, reused across invocations.
var (
	tableName = os.Getenv("TABLE_NAME")
	dbClient  *dynamodb.Client
)

// handler routes the request to the correct method handler.
func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch request.HTTPMethod {
	case "POST":
		return handleCreate(ctx, request)
	case "PUT":
		return handleUpdate(ctx, request)
	case "DELETE":
		return handleDelete(ctx, request)
	default:
		return jsonResponse(405, map[string]string{"message": "method not allowed"})
	}
}

// jsonResponse is a helper that serialises any value to a JSON API Gateway response.
func jsonResponse(statusCode int, body interface{}) (events.APIGatewayProxyResponse, error) {
	b, _ := json.Marshal(body)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       string(b),
		Headers:    map[string]string{"Content-Type": "application/json"},
	}, nil
}

// main initialises the AWS SDK client and starts the Lambda handler loop.
func main() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("unable to load AWS config: %v", err))
	}
	dbClient = dynamodb.NewFromConfig(cfg)
	lambda.Start(handler)
}
