// npm install @mendable/firecrawl-js
import Firecrawl from "@mendable/firecrawl-js";

const FireCrawlApp = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
export default FireCrawlApp;
