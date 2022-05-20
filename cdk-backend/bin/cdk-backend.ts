#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StoryBlokPipelineStack } from "../lib/story-blok-pipeline-stack";

const app = new cdk.App();

new StoryBlokPipelineStack(app, "StoryBlokStack", {
  env: { account: "113510251150", region: "eu-central-1" }
});

app.synth();