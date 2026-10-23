import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native ONNX runtime bindings can't be bundled; load them from node_modules at runtime.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
};

export default nextConfig;
