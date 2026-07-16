import { createGyazoClient, GyazoAPIError } from "@mktbsh/gyazo-api";

const accessToken = process.env.GYAZO_ACCESS_TOKEN;
if (!accessToken) throw new Error("GYAZO_ACCESS_TOKEN is required");

const client = createGyazoClient({ accessToken });
const result = await client.images.list({ perPage: 10 });

if (result.ok) {
  console.log(result.value.images);
} else if (result.error instanceof GyazoAPIError) {
  console.error(result.error.status, result.error.message);
} else {
  console.error(result.error.kind, result.error.message);
}
