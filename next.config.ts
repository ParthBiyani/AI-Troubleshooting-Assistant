import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The corner badge only appears in development and clutters demos and screenshots.
  devIndicators: false,
  // Native ONNX runtime bindings can't be bundled; load them from node_modules at runtime.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
  outputFileTracingIncludes: {
    // The embedding model (downloaded by the prebuild step) must ship with the function.
    "/api/ask": [
      "./.model-cache/**",
      // The tracer does not follow the native loader, so ship the Linux x64 runtime explicitly.
      "./node_modules/onnxruntime-node/package.json",
      "./node_modules/onnxruntime-node/dist/**",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**",
    ],
  },
  outputFileTracingExcludes: {
    // Serverless runs on Linux; leave out other platforms' binaries to stay under the size limit.
    "/api/ask": [
      "node_modules/onnxruntime-node/bin/napi-v6/darwin/**",
      "node_modules/onnxruntime-node/bin/napi-v6/win32/**",
      "node_modules/onnxruntime-node/bin/napi-v6/linux/arm64/**",
      "node_modules/onnxruntime-web/**",
    ],
  },
};

export default nextConfig;
