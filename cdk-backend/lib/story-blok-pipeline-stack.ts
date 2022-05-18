import { Stack, StackProps } from "aws-cdk-lib";

import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep
} from "aws-cdk-lib/pipelines";

import { Construct } from "constructs";

// import { StoryBlokPipelineStage } from "./story-blok-stage";


export class StoryBlokPipelineStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    //const pipeline =
     new CodePipeline(this, "Pipeline", {
      pipelineName: "StoryBlokPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub("virtualidentityag/vi-storyblok-deepl-translation-app", "deployment"),
        commands: [
          'cd cdk-backend',
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
        primaryOutputDirectory: "/cdk-backend/cdk.out"
      })
    });
  }}