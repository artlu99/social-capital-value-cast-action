import { init, fetchQuery } from "@airstack/node";
import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { neynar } from "frog/hubs";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "NEYNAR_FROG_FM";
const AIRSTACK_API_KEY =
  process.env.AIRSTACK_API_KEY ?? "YOUR_AIRSTACK_API_KEY";

const ADD_URL =
  process.env.ADD_URL ??
  "https://warpcast.com/~/add-cast-action?url=https://social-capital-value-cast-action.vercel.app/api/scv";
const ABOUT_ACTION_URL =
  process.env.ABOUT_ACTION_URL ??
  "https://social-capital-value-cast-action.vercel.app/api/about";
const ABOUT_SCV_URL =
  process.env.ABOUT_SCV_URL ??
  "https://docs.airstack.xyz/airstack-docs-and-faqs/abstractions/trending-casts/social-capital-value";

init(AIRSTACK_API_KEY, "prod");

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  hub: neynar({ apiKey: NEYNAR_API_KEY }),
  browserLocation: ADD_URL,
});

app.castAction(
  "/scv",
  async (c) => {
    const {
      verified,
      actionData: {
        castId: { hash: castHash },
      },
    } = c;

    if (verified) {
      const { data, error } = await fetchQuery(
        `
    query MyQuery($blockchain: EveryBlockchain!, $_eq: String) {
      FarcasterCasts(input: {blockchain: $blockchain, filter: {hash: {_eq: $_eq}}}) {
        Cast {
          fid
          hash
          socialCapitalValue {
            formattedValue
            rawValue
          }
        }
      }
    }
    `,
        { blockchain: "ALL", _eq: castHash }
      );

      if (error) {
        console.log(error);
        return c.message({ message: "ERR: Airstack query" });
      }
      const firstCast = data?.FarcasterCasts?.Cast[0];
      const scvFormattedValue = (firstCast?.socialCapitalValue.formattedValue ||
        0) as number;
      console.log(scvFormattedValue);
      return c.message({ message: scvFormattedValue.toString() });
    } else {
      return c.message({ message: "Unverified FID" });
    }
  },
  {
    name: "Airstack SCV 😎",
    icon: "sun",
    description:
      "Airstack's 😎 Social Capital Value (SCV), a  metric to identify high-quality Trending Casts on Farcaster.",
    aboutUrl: ABOUT_ACTION_URL,
  }
);

app.frame("/", (c) => {
  const { status } = c;

  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background:
            status !== "response"
              ? "linear-gradient(to right, #432889, #17101F)"
              : "black",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
          }}
        >
          Social Capital Value (SCV) : Airstack's metric to identify
          high-quality Trending Casts on Farcaster.
        </div>
      </div>
    ),
    intents: [
      <Button.AddCastAction action="/scv">Add Action</Button.AddCastAction>,
      <Button.Link href="https://frog.fm">🐸 Frog</Button.Link>,
      <Button.Link href="https://farcaster.id/artlu">@artlu 👃</Button.Link>,
      <Button.Link href={ABOUT_SCV_URL}>SCV</Button.Link>,
    ],
  });
});

app.hono.get("/about", (c) => {
  return c.text("Social Capital Value Cast Action by @artlu");
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
