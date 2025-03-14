import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";

// Import app types to get all ambient module declarations
import type {} from "../app";

process.env.ENABLE_PREVIEW = "test";

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;

declare global {
  // eslint-disable-next-line no-var
  var expect: Chai.ExpectStatic;
}

global.sinon = sinon;
global.expect = expect;
