/*
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class StoryBlokStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    stageName: string,
    props?: StackProps
  ) {
    super(scope, id, props);

    new NodejsFunction(this, "StoryBlokFunction", {
      runtime: Runtime.NODEJS_14_X,
      handler: "handler.handler",
      entry: path.join(__dirname, "/../src/handler.ts"),
      environment: { "stageName": stageName }
    });

    const bucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: "apis.storyblok.deepl",
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket
            },
            behaviors: [{ isDefaultBehavior: true }]
          }
        ]
      }
    );

    new s3Deploy.BucketDeployment(this, "DeployToBucket", {
      sources: [s3Deploy.Source.asset("../build")],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"]
    });
  }
}

*/