import { Annotations, IAspect, Stack } from 'aws-cdk-lib';

import { IConstruct } from 'constructs';

export class RequiredTagsChecker implements IAspect {
  constructor(private readonly requiredTags: string[]) {}

  // ensure that our stacks are tagged correctly
  public visit(node: IConstruct): void {
    if (!(node instanceof Stack)) return;

    if (!node.tags.hasTags()) {
      Annotations.of(node).addError(`There are no tags on "${node.stackName}"`);
    }

    this.requiredTags.forEach((tag) => {
      if (!Object.keys(node.tags.tagValues()).includes(tag)) {
        Annotations.of(node).addError(
          `"${tag}" is missing from stack with id "${node.stackName}"`
        );
      }
    });
  }
}
