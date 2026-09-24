Changed: the Node package is no longer published to npm. It is now a private,
internal frontend workspace (`agent-transcript-viewer-frontend`) whose built
viewer artifact will be bundled into the Python wheel. The bin shim,
platform `optionalDependencies`, and publish config are removed.
