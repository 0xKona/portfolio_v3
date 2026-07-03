package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

var (
	tableName      = os.Getenv("TABLE_NAME")
	distributionId string
	domainName     = os.Getenv("DOMAIN_NAME")
	dbClient       *dynamodb.Client
	cfClient       *cloudfront.Client
)

func main() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("unable to load AWS config: %v", err))
	}
	dbClient = dynamodb.NewFromConfig(cfg)
	cfClient = cloudfront.NewFromConfig(cfg)

	// Read the CloudFront distribution ID from SSM at cold start.
	// FrontendStack writes this value; we read it to avoid circular deps.
	ssmClient := ssm.NewFromConfig(cfg)
	paramName := os.Getenv("DISTRIBUTION_ID_PARAM")
	result, err := ssmClient.GetParameter(context.Background(), &ssm.GetParameterInput{
		Name: aws.String(paramName),
	})
	if err != nil {
		panic(fmt.Sprintf("failed to read distribution ID from SSM (%s): %v", paramName, err))
	}
	distributionId = aws.ToString(result.Parameter.Value)

	lambda.Start(handler)
}
