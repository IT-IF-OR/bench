import { HyperCore } from "@hyperttp/core";

const server = new HyperCore({ verbose: true });
console.log(await server.getTransportName());
