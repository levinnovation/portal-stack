/* eslint-disable no-restricted-exports */
import type { Metadata } from "next";
import config from "@payload-config";
import { generatePageMetadata, RootPage } from "@payloadcms/next/views";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, importMap, params, searchParams } as any);

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, importMap, params, searchParams } as any);

export default Page;
