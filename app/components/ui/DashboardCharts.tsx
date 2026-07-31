"use client";

import {
 Bar,
 BarChart,
 CartesianGrid,
 Cell,
 LabelList,
 XAxis,
 YAxis,
} from "recharts";

import {
 ChartConfig,
 ChartContainer,
 ChartLegend,
 ChartLegendContent,
 ChartTooltip,
 ChartTooltipContent,
} from "@/components/ui/chart";
import { Card } from "./Card";

type MetricDatum = {
 label: string;
 value: number;
};

type AccountDatum = {
 label: string;
 active: number;
 inactive: number;
};

interface ChartCardProps {
 title: string;
 description: string;
 loading?: boolean;
 emptyMessage?: string;
}

interface MetricBarChartProps extends ChartCardProps {
 data: MetricDatum[];
}

interface AccountStatusChartProps extends ChartCardProps {
 data: AccountDatum[];
}

const metricChartConfig = {
 value: {
 label: "Count",
 color: "var(--chart-1)",
 },
} satisfies ChartConfig;

const accountChartConfig = {
 active: {
 label: "Active",
 color: "var(--chart-1)",
 },
 inactive: {
 label: "Inactive",
 color: "var(--chart-4)",
 },
} satisfies ChartConfig;

const metricColors = [
 "var(--chart-1)",
 "var(--chart-2)",
 "var(--chart-3)",
 "var(--chart-4)",
 "var(--chart-5)",
];

function ChartCardHeader({
 title,
 description,
}: Pick<ChartCardProps, "title" | "description">) {
 return (
 <div>
 <h2 className="font-heading text-lg font-semibold">{title}</h2>
 <p className="mt-1 text-sm leading-6 text-muted-foreground">
 {description}
 </p>
 </div>
 );
}

function ChartLoadingState() {
 return (
 <div
 className="mt-6 h-72 animate-pulse rounded-2xl bg-muted"
 aria-label="Loading chart"
 />
 );
}

export function MetricBarChart({
 title,
 description,
 data,
 loading = false,
 emptyMessage = "No data is available yet.",
}: MetricBarChartProps) {
 const hasData = data.some((item) => item.value > 0);

 return (
 <Card>
 <ChartCardHeader title={title} description={description} />

 {loading ? (
 <ChartLoadingState />
 ) : hasData ? (
 <ChartContainer
 config={metricChartConfig}
 className="mt-6 h-72 w-full aspect-auto"
 >
 <BarChart
 accessibilityLayer
 data={data}
 layout="vertical"
 margin={{ left: 8, right: 36 }}
 >
 <CartesianGrid horizontal={false} />
 <XAxis type="number" hide allowDecimals={false} />
 <YAxis
 dataKey="label"
 type="category"
 width={112}
 tickLine={false}
 axisLine={false}
 tickMargin={8}
 />
 <ChartTooltip
 cursor={{ fill: "var(--muted)", opacity: 0.45 }}
 content={<ChartTooltipContent hideLabel />}
 />
 <Bar dataKey="value" radius={[0, 6, 6, 0]}>
 {data.map((item, index) => (
 <Cell
 key={item.label}
 fill={metricColors[index % metricColors.length]}
 />
 ))}
 <LabelList
 dataKey="value"
 position="right"
 className="fill-foreground font-medium"
 />
 </Bar>
 </BarChart>
 </ChartContainer>
 ) : (
 <p className="mt-6 flex h-72 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
 {emptyMessage}
 </p>
 )}
 </Card>
 );
}

export function AccountStatusChart({
 title,
 description,
 data,
 loading = false,
 emptyMessage = "No account data is available yet.",
}: AccountStatusChartProps) {
 const hasData = data.some((item) => item.active > 0 || item.inactive > 0);

 return (
 <Card>
 <ChartCardHeader title={title} description={description} />

 {loading ? (
 <ChartLoadingState />
 ) : hasData ? (
 <ChartContainer
 config={accountChartConfig}
 className="mt-6 h-72 w-full aspect-auto"
 >
 <BarChart
 accessibilityLayer
 data={data}
 margin={{ top: 12, right: 8, left: -16 }}
 >
 <CartesianGrid vertical={false} />
 <XAxis
 dataKey="label"
 tickLine={false}
 axisLine={false}
 tickMargin={10}
 />
 <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
 <ChartTooltip
 cursor={{ fill: "var(--muted)", opacity: 0.45 }}
 content={<ChartTooltipContent />}
 />
 <ChartLegend content={<ChartLegendContent />} />
 <Bar
 dataKey="active"
 fill="var(--color-active)"
 radius={[6, 6, 0, 0]}
 />
 <Bar
 dataKey="inactive"
 fill="var(--color-inactive)"
 radius={[6, 6, 0, 0]}
 />
 </BarChart>
 </ChartContainer>
 ) : (
 <p className="mt-6 flex h-72 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
 {emptyMessage}
 </p>
 )}
 </Card>
 );
}
