import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Tags, addTagsToStack, requiredTags } from '../infra-common';

import { Construct } from 'constructs';
import { RequiredTagsChecker } from '../infra-common/required-tags-checker';
import { SimpleTable } from '../shared-constructs';
import { supressions } from './stateful.supressions';

export class LeeChargingStatefulStack extends cdk.Stack {
  public table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // we add the tags for the stack
    const tags: Tags = {
      'ev:operations:StackId': 'Stateful',
      'ev:operations:ServiceId': 'EV',
      'ev:operations:ApplicationId': 'Api',
      'ev:cost-allocation:Owner': 'Lee',
      'ev:cost-allocation:ApplicationId': 'Api',
    };

    // create the dynamo table for the ev charging solution
    this.table = new SimpleTable(this, 'LeeChargingTable', {
      tableName: 'lee-charging-table',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    }).table;

    // add the tags to all constructs in the stack
    addTagsToStack(this, tags);

    // for compliance ensure we have the required tags
    cdk.Aspects.of(this).add(new RequiredTagsChecker(requiredTags));

    // cdk nag check and suppressions
    cdk.Aspects.of(this).add(new AwsSolutionsChecks({ verbose: false }));
    NagSuppressions.addStackSuppressions(this, [...supressions], true);
  }
}
