module.exports = {
  verbose: true,
  moduleFileExtensions: ["js", "json", "jsx", "node", "mjs"],
  transformIgnorePatterns: [
    "node_modules/"
  ],
  transform : {
    "^.+\\.m?[t|j]sx?$": "babel-jest"
  },
  "setupFiles": [
    "<rootDir>/test/setup.js"
  ]
}
