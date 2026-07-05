package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

var (
	tableName  = os.Getenv("TABLE_NAME")
	hmacSecret string
	dbClient   *dynamodb.Client
)

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch request.HTTPMethod {
	case "POST":
		return handleCreate(ctx, request)
	default:
		return jsonResponse(405, map[string]string{"message": "method not allowed"})
	}
}

func jsonResponse(statusCode int, body interface{}) (events.APIGatewayProxyResponse, error) {
	b, _ := json.Marshal(body)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       string(b),
		Headers:    map[string]string{"Content-Type": "application/json"},
	}, nil
}

func main() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("unable to load AWS config: %v", err))
	}
	dbClient = dynamodb.NewFromConfig(cfg)

	// Read HMAC secret from SSM at cold start — no redeploy needed after rotation.
	paramName := os.Getenv("HMAC_SECRET_PARAM")
	if paramName != "" {
		ssmClient := ssm.NewFromConfig(cfg)
		result, err := ssmClient.GetParameter(context.Background(), &ssm.GetParameterInput{
			Name: aws.String(paramName),
		})
		if err != nil {
			fmt.Printf("WARN: failed to read HMAC secret from SSM (%s): %v\n", paramName, err)
		} else {
			hmacSecret = aws.ToString(result.Parameter.Value)
		}
	}

	lambda.Start(handler)
}
