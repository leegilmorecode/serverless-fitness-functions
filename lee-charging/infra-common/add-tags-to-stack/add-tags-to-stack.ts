import * as cdk from 'aws-cdk-lib';

export const requiredTags = [
  'ev:operations:StackId',
  'ev:operations:ServiceId',
  'ev:operations:ApplicationId',
  'ev:cost-allocation:Owner',
  'ev:cost-allocation:ApplicationId',
];

export type Tags = Record<string, string>;

export function addTagsToStack(stack: cdk.Stack, tags: Tags) {
  Object.entries(tags).forEach((tag) => {
    cdk.Tags.of(stack).add(...tag);
  });
}
