"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import styles from "./dashboard-sections.module.css";

type ChartRow = { date?: string; [field: string]: unknown };
type ChartPoint = { date: Date; value: number; volume: number };
type StockChart = { clear(): void };
type StockLibrary = {
  makeChart(id: string, config: Record<string, unknown>): StockChart;
};

const chartBase = "https://www.amcharts.com/lib/3/";
let stockLibrary: Promise<StockLibrary> | undefined;
const scriptLoads = new Map<string, Promise<void>>();
let exportPlugin: Promise<void> | undefined;

function loadScript(path: string) {
  const previous = scriptLoads.get(path);
  if (previous) return previous;
  const request = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = chartBase + path;
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      scriptLoads.delete(path);
      reject(new Error(`Could not load ${path}`));
    };
    const timer = window.setTimeout(fail, 10000);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = fail;
    document.head.append(script);
  });
  scriptLoads.set(path, request);
  return request;
}

function loadStockLibrary() {
  stockLibrary ??= (async () => {
    await loadScript("amcharts.js");
    await loadScript("serial.js");
    await loadScript("amstock.js");
    const library = (window as Window & { AmCharts?: StockLibrary }).AmCharts;
    if (!library) throw new Error("Stock chart library did not initialize");

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = chartBase + "plugins/export/export.css";
    document.head.append(stylesheet);
    exportPlugin = loadScript("plugins/export/export.min.js").catch(() => {});
    return library;
  })().catch((error: unknown) => {
    stockLibrary = undefined;
    throw error;
  });
  return stockLibrary;
}

const memberSeries = [
  ["Active", "Active"],
  ["Inactive", "Inactive"],
  ["NotApproved", "Not Approved"],
] as const;

const chartConfigs = [
  {
    id: "sellerGraph",
    title: "Seller Graph",
    path: "sellers/chart",
    series: [...memberSeries, ["NotCompleted", "Not Completed"], ["Deleted", "Deleted"]],
    overallTitle: "All Active Sellers",
    requestOverall: true,
  },
  {
    id: "buyerGraph",
    title: "Buyer Graph",
    path: "buyers/chart",
    series: [...memberSeries, ["Deleted", "Deleted"]],
    overallTitle: "All Active Buyers",
    overallField: "Active",
    showFrom: true,
  },
  {
    id: "enquiryGraph",
    title: "Leads Graph",
    path: "enquiries/chart",
    series: [["Approved", "Approved"], ["NotApproved", "Not Approved"]],
    overallTitle: "All Enquiries",
    overallField: "Total",
    requestOverall: true,
    largeMargin: true,
  },
] satisfies Array<{
  id: string;
  title: string;
  path: string;
  series: ReadonlyArray<readonly [string, string]>;
  overallTitle: string;
  overallField?: string;
  requestOverall?: boolean;
  showFrom?: boolean;
  largeMargin?: boolean;
}>;

const periods = [
  { period: "ALLACTIVE", label: "Overall" },
  { period: "MM", count: 1, label: "1 month" },
  { period: "YYYY", count: 1, label: "1 year" },
  { period: "YTD", label: "YTD" },
  { period: "MAX", label: "MAX" },
];

function numericValue(value: unknown) {
  const number = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(number) ? number : 0;
}

function DashboardStockChart({ config }: { config: (typeof chartConfigs)[number] }) {
  const { id, title, path, series, overallTitle, overallField = "value", requestOverall, showFrom, largeMargin } = config;
  const container = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState("MM");
  const [status, setStatus] = useState("Loading chart…");
  const [attempt, setAttempt] = useState(0);
  const [from, setFrom] = useState("");
  const overall = period === "ALLACTIVE";

  useEffect(() => {
    const host = container.current;
    if (!host) return;

    const controller = new AbortController();
    let chart: StockChart | undefined;
    const switchData = (event: MouseEvent) => {
      const button = event.target;
      if (!(button instanceof HTMLInputElement)) return;
      const selected = periods.find(({ label }) => label === button.value);
      if (!selected || (selected.period === period || (!overall && selected.period !== "ALLACTIVE"))) return;
      event.stopPropagation();
      event.preventDefault();
      setPeriod(selected.period);
    };
    host.addEventListener("click", switchData, true);
    setFrom("");
    setStatus("Loading chart…");

    async function renderChart() {
      const rows = await apiFetch<ChartRow[]>(path + (overall && requestOverall ? "?type=ALLACTIVE" : ""), {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      });
      if (controller.signal.aborted) return;

      const datedRows = rows
        .filter((row) => typeof row?.date === "string" && row.date)
        .map((row) => ({
          row,
          date: new Date(/^\d{4}-\d{2}-\d{2}$/.test(row.date ?? "")
            ? row.date + "T00:00:00"
            : row.date ?? ""),
        }))
        .filter(({ date }) => Number.isFinite(date.getTime()))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (!datedRows.length) {
        setStatus("No chart data available.");
        return;
      }

      const library = await loadStockLibrary();
      await exportPlugin;
      if (controller.signal.aborted) return;

      const fields = overall ? [[overallField, overallTitle] as const] : series;
      const dataSets = fields.map(([field, name]) => ({
        title: name,
        fieldMappings: [
          { fromField: "value", toField: "value" },
          { fromField: "volume", toField: "volume" },
        ],
        dataProvider: datedRows.map(({ date, row }): ChartPoint => {
          const value = numericValue(overall && requestOverall ? row.value ?? row[field] : row[field]);
          return { date, value, volume: value };
        }),
        categoryField: "date",
      }));

      const firstSeries = dataSets[0].dataProvider;
      const firstDate = (firstSeries.find(({ value }) => value > 0) ?? firstSeries[0]).date;
      if (overall || showFrom) {
        setFrom(firstDate.toLocaleDateString("en-GB").replaceAll("/", "-"));
      }

      chart = library.makeChart(`${id}Chart`, {
        type: "stock",
        theme: "none",
        path: chartBase,
        dataSets,
        panels: [
          {
            showCategoryAxis: false,
            title: "Value",
            percentHeight: 70,
            stockGraphs: [{
              id: "g1",
              valueField: "value",
              comparable: true,
              compareField: "value",
              balloonText: "[[title]]: <b>[[value]]</b>",
              compareGraphBalloonText: "[[title]]: <b>[[value]]</b>",
            }],
            stockLegend: {
              periodValueTextComparing: "[[percents.value.close]]%",
              periodValueTextRegular: "[[value.close]]",
            },
          },
          {
            title: "Volume",
            percentHeight: 30,
            stockGraphs: [{ valueField: "volume", type: "column", showBalloon: false, fillAlphas: 1 }],
            stockLegend: { periodValueTextRegular: "[[value.close]]" },
          },
        ],
        chartScrollbarSettings: { graph: "g1" },
        chartCursorSettings: {
          valueBalloonsEnabled: true,
          fullWidth: true,
          cursorAlpha: 0.1,
          valueLineBalloonEnabled: true,
          valueLineEnabled: true,
          valueLineAlpha: 0.5,
        },
        dataSetSelector: { position: "left" },
        periodSelector: {
          position: "left",
          periods: periods.map((option) => ({
            ...option,
            selected: !overall && option.period === period,
          })),
          ...(overall && {
            startDate: id === "enquiryGraph" ? firstSeries[0].date : firstDate,
            endDate: firstSeries[firstSeries.length - 1].date,
          }),
        },
        export: { enabled: true, path: chartBase + "plugins/export/" },
      });
      setStatus("");
    }

    void renderChart().catch(() => {
      if (!controller.signal.aborted) setStatus("Chart could not be loaded.");
    });
    return () => {
      controller.abort();
      host.removeEventListener("click", switchData, true);
      chart?.clear();
    };
  }, [id, path, series, period, overall, overallTitle, overallField, requestOverall, showFrom, attempt]);

  return (
    <section id={id} className={styles.stockSection}>
      <h6 className="mb-0 text-uppercase">{title}</h6>
      <hr />
      <div className={`card ${styles.stockCard}`}>
        <div className="card-body mb-4">
          {from && <div className={styles.stockFrom}>From: <span>{from}</span></div>}
          {status && (
            <p className="mb-0" role="status">
              {status}
              {status === "Chart could not be loaded." && (
                <button className="btn btn-link py-0" type="button" onClick={() => setAttempt((previous) => previous + 1)}>Retry</button>
              )}
              {overall && status !== "Loading chart…" && (
                <button className="btn btn-link py-0" type="button" onClick={() => setPeriod("MM")}>
                  Back to 1 month
                </button>
              )}
            </p>
          )}
          <div
            ref={container}
            id={`${id}Chart`}
            aria-label={title}
            data-overall={overall}
            className={`${styles.stockChart} ${largeMargin ? "my-5" : "my-3"}`}
          />
        </div>
      </div>
    </section>
  );
}

export default function DashboardStockCharts() {
  return chartConfigs.map((config) => <DashboardStockChart key={config.id} config={config} />);
}
