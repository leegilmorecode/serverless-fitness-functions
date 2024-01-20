#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { LeeChargingStatefulStack } from '../stateful/stateful';
import { LeeChargingStatelessStack } from '../stateless/stateless';

const app = new cdk.App();
const stateful = new LeeChargingStatefulStack(app, 'EVStateful', {});
new LeeChargingStatelessStack(app, 'EVStateless', {
  table: stateful.table,
});
