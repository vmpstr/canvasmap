import 'jest-canvas-mock';
import { RunLoop } from '../src/run_loop.mjs'

RunLoop.draw = () => {};

global.fetch = require('jest-fetch-mock');
