/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Infographic from "../src/components/Infographic";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [infographicData, setInfographicData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setInfographicData(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: url,
          density: "standard",
          narrativeFocus: "data-heavy",
        }),
      });

      if (!response.ok) throw new Error("API Request Failed");

      const rawData = await response.json();

      let finalData = rawData;
      if (rawData.result) finalData = rawData.result;
      if (rawData.output) finalData = rawData.output;

      if (finalData && finalData.sections) {
        setInfographicData(finalData);
      } else {
        console.error("Invalid Data Shape:", finalData);
        alert(
          "The AI generated data, but the format was unexpected. Check the browser console.",
        );
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Something went wrong. Check your terminal logs!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-6">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          InfoPix Engine
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Paste a GitHub README or documentation URL below. Our autonomous agent
          workflow will scrape, analyze, and design a structured infographic in
          seconds.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <input
            type="url"
            required
            placeholder="https://raw.githubusercontent.com/mastra-ai/mastra/main/README.md"
            className="w-full sm:max-w-xl px-6 py-4 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg focus:ring-4 focus:ring-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Orchestrating...
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </form>
      </div>

      {loading && (
        <div className="max-w-2xl mx-auto text-center mt-20 p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium animate-pulse">
            1. Content Agent is scraping the URL...
            <br />
            2. Formatting Agent is structuring JSON...
            <br />
            3. Critic Agent is verifying facts...
          </p>
        </div>
      )}

      {infographicData && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out pb-20">
          <Infographic data={infographicData} />
        </div>
      )}
    </main>
  );
}
