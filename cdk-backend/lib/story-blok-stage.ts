/*
import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StoryBlokStack } from "./story-blok-stack";

export class StoryBlokPipelineStage extends Stage {
  public readonly urlOutput: CfnOutput;

  constructor(
    scope: Construct,
    stageName: string,
    props?: StageProps
  ) {
    super(scope, stageName, props);

    const storyBlokStack = new StoryBlokStack(
      this,
      "StoryBlokStack",
      stageName
    );
  }
}
*/