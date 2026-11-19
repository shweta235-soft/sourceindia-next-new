"use client";

import { useEffect, useId, useState } from "react";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartData, type ChartOptions } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";
import Select, { type StylesConfig } from "react-select";
import { apiFetch } from "@/lib/api";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import styles from "./reports.module.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const graphGroups = {
  seller: {
    page: "Sellers", axis: "Seller Count", endpoint: "seller-bar-graph", padding: 40,
    levels: [["categories", "Category", "Categories"], ["sub_categories", "Subcategory", "Subcategories"]],
  },
  product: {
    page: "Products", axis: "Product Count", endpoint: "product-bar-graph", padding: 0,
    levels: [
      ["categories", "Category", "Categories"], ["sub_categories", "Subcategory", "Subcategories"],
      ["item_category", "Item Category", "Item Categories"], ["item_sub_category", "Item Subcategory", "Item Subcategories"],
      ["items", "Item", "Items"],
    ],
  },
  sourcing: {
    page: "Sourcing Interests", axis: "Seller Count", endpoint: "sourcing-interest-bar-graph", padding: 0,
    levels: [["item_category", "Category", "Categories"], ["item_sub_category", "Subcategory", "Subcategories"]],
  },
} as const;

type Group = keyof typeof graphGroups;
type FilterOption = { label: string; value: number };
type Graph = ChartData<"bar", number[], string>;

const selectStyles: StylesConfig<FilterOption, true> = {
  control: (base) => ({ ...base, minHeight: 45, borderRadius: 8, borderColor: "#ccc", boxShadow: "none", "&:hover": { borderColor: "#888" } }),
  multiValue: (base) => ({ ...base, backgroundColor: "#007bff33", borderRadius: 4 }),
  multiValueLabel: (base) => ({ ...base, color: "#007bff", fontWeight: 500 }),
  multiValueRemove: (base) => ({ ...base, color: "#007bff", ":hover": { backgroundColor: "#007bff", color: "#fff" } }),
  menu: (base) => ({ ...base, borderRadius: 8, zIndex: 4 }),
  option: (base, state) => ({
    ...base, backgroundColor: state.isSelected ? "#007bff" : state.isFocused ? "#e6f0ff" : "#fff",
    color: state.isSelected ? "#fff" : "#333", cursor: "pointer",
  }),
};

function normalizeGraph(raw: Graph): Graph {
  if (!Array.isArray(raw?.labels) || !raw.labels.every((label) => typeof label === "string") ||
      !Array.isArray(raw.datasets) || !raw.datasets.length ||
      !raw.datasets.every((entry) => entry && Array.isArray(entry.data) && entry.data.length === raw.labels?.length)) {
    throw new Error("Unexpected graph response.");
  }
  return {
    labels: raw.labels,
    datasets: raw.datasets.map(({ label, data, backgroundColor, borderColor, borderWidth }) => ({
      label, backgroundColor, borderColor, borderWidth,
      data: data.map((value) => {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : 0;
      }),
    })),
  };
}

function CategoryGraph({ path, title, axis, labels, padding }: {
  path: string; title: string; axis: string; labels: string; padding: number;
}) {
  const headingId = useId();
  const [graph, setGraph] = useState<Graph>();
  const [selected, setSelected] = useState<readonly FilterOption[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    apiFetch<Graph>(path, { signal }).then(normalizeGraph).then((result) => {
      if (controller.signal.aborted) return;
      const options = result.labels!.flatMap((label, value) =>
        result.datasets.some((dataset) => dataset.data[value] > 0) ? [{ label, value }] : [],
      );
      setSelected(options.length > 30 ? options.slice(0, 10) : options);
      setGraph(result);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [path, attempt]);

  const choices = graph?.labels?.flatMap((label, value) =>
    graph.datasets.some((dataset) => dataset.data[value] > 0) ? [{ label, value }] : [],
  ) ?? [];
  const data: Graph | undefined = graph && {
    labels: selected.map(({ label }) => label),
    datasets: graph.datasets.map((dataset) => ({ ...dataset, data: selected.map(({ value }) => dataset.data[value]) })),
  };
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: padding } },
    plugins: {
      legend: { position: "top" },
      tooltip: { enabled: true },
      datalabels: { anchor: "end", align: "top", offset: padding ? 4 : 0, color: "#333", font: { weight: "bold", size: 12 } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: axis } },
      x: { title: { display: true, text: labels } },
    },
  };

  return <section className={`my-3 ${styles.chartPanel}`} aria-labelledby={headingId}>
    <h4 id={headingId} className={styles.chartTitle}>{title}</h4>
    {failed ? <p role="alert">Chart could not be loaded. <button type="button" className="btn btn-sm btn-link" onClick={() => {
      setFailed(false);
      setAttempt((number) => number + 1);
    }}>Retry</button></p> : !data ? <p role="status">Loading chart...</p> : <>
      {choices.length > 30 && <div className={styles.chartFilter}>
        <Select<FilterOption, true>
          instanceId={headingId} aria-label={`${title} filter`} isMulti isClearable closeMenuOnSelect={false}
          hideSelectedOptions={false} options={choices} value={selected} onChange={setSelected}
          placeholder={`Select ${labels.toLowerCase()}...`} styles={selectStyles}
        />
      </div>}
      {selected.length > 0 ? <div className={styles.chartCanvas}>
        <Bar data={data} options={options} plugins={[ChartDataLabels]} aria-label={title} role="img" />
      </div> : <p role="status">{choices.length ? "Select categories to display the chart." : "No data available."}</p>}
    </>}
  </section>;
}

export default function CategoryGraphs({ group }: { group: Group }) {
  const config = graphGroups[group];
  return <>
    <ReportsBreadcrumb page={config.page} title="Graph" />
    {config.levels.map(([resource, level, labels]) => {
      const title = group === "product" ? `Products per ${level} (Approved vs Unapproved)` :
        group === "seller" ? `Sellers per ${level}` : `Sourcing Interest per ${level}`;
      return <CategoryGraph key={resource} path={`${resource}/${config.endpoint}`} title={title} axis={config.axis}
        labels={labels} padding={config.padding} />;
    })}
  </>;
}
