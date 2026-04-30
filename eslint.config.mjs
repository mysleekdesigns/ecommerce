import next from "eslint-config-next";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
  ...next,
];

export default config;
