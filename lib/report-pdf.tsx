import "server-only";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { AnalyticsPost, PostAnalytics } from "@/lib/zernio";

/**
 * Renders the PDF analytics report. Kept in its own .tsx file because route
 * handlers (app/api/**\route.ts) cannot contain JSX.
 */

export interface ReportData {
  email: string;
  from?: string;
  to?: string;
  posts: AnalyticsPost[];
  daily: { date: string; metrics?: PostAnalytics }[];
  followers: { date: string; followers: number }[];
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#111827", fontFamily: "Helvetica" },
  h1: { fontSize: 20, marginBottom: 2, color: "#059669" },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 16 },
  h2: { fontSize: 13, marginTop: 18, marginBottom: 8, color: "#111827" },
  row: { flexDirection: "row", gap: 8, marginBottom: 4 },
  card: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 8 },
  cardLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  cardValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  table: { width: "100%", marginTop: 4 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 4,
    marginBottom: 4,
  },
  th: { flex: 1, fontSize: 8, color: "#6b7280", textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 3 },
  td: { flex: 1, fontSize: 9, paddingRight: 6 },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#9ca3af" },
});

const fmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function metric(p: PostAnalytics | undefined, key: keyof PostAnalytics): number {
  return typeof p?.[key] === "number" ? (p[key] as number) : 0;
}

function sum(posts: AnalyticsPost[], key: keyof PostAnalytics): number {
  return posts.reduce(
    (acc, p) =>
      acc + metric(p.analytics, key) + (p.platforms ?? []).reduce((a, pl) => a + metric(pl.analytics, key), 0),
    0
  );
}

export async function buildReportPdf(data: ReportData): Promise<Buffer> {
  const { posts, daily, followers, from, to } = data;

  const likes = sum(posts, "likes");
  const comments = sum(posts, "comments");
  const shares = sum(posts, "shares");
  const impressions = sum(posts, "impressions");
  const reach = sum(posts, "reach");
  const er = impressions > 0 ? ((likes + comments + shares) / impressions) * 100 : 0;
  const totalDays = daily.length;
  const avgLikes = totalDays ? Math.round(likes / totalDays) : 0;
  const avgComments = totalDays ? Math.round(comments / totalDays) : 0;

  const sorted = [...posts].sort(
    (a, b) =>
      metric(b.analytics ?? b.platforms?.[0]?.analytics, "likes") +
        metric(b.platforms?.find((p) => p.analytics)?.analytics ?? b.analytics, "comments") -
      (metric(a.analytics ?? a.platforms?.[0]?.analytics, "likes") +
        metric(a.platforms?.find((p) => p.analytics)?.analytics ?? a.analytics, "comments"))
  );
  const topPosts = sorted.slice(0, 5);

  const MyDocument = (
    <Document title={`Social Hub report ${from ?? ""} - ${to ?? ""}`} author="Social Hub">
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Social Hub Analytics Report</Text>
        <Text style={styles.subtitle}>
          {data.email} · {from ?? "start"} to {to ?? "today"} · Generated{" "}
          {new Date().toLocaleDateString()}
        </Text>

        <Text style={styles.h2}>Overview</Text>
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Impressions</Text>
            <Text style={styles.cardValue}>{fmt.format(impressions)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Reach</Text>
            <Text style={styles.cardValue}>{fmt.format(reach)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Engagement rate</Text>
            <Text style={styles.cardValue}>{er.toFixed(1)}%</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Posts</Text>
            <Text style={styles.cardValue}>{posts.length}</Text>
          </View>
        </View>

        <Text style={styles.h2}>Engagement breakdown</Text>
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Likes</Text>
            <Text style={styles.cardValue}>{fmt.format(likes)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Comments</Text>
            <Text style={styles.cardValue}>{fmt.format(comments)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Shares</Text>
            <Text style={styles.cardValue}>{fmt.format(shares)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Avg / day</Text>
            <Text style={styles.cardValue}>
              {avgLikes}L · {avgComments}C
            </Text>
          </View>
        </View>

        {topPosts.length > 0 && (
          <>
            <Text style={styles.h2}>Top posts</Text>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.th, { flex: 3 }]}>Post</Text>
                <Text style={styles.th}>Likes</Text>
                <Text style={styles.th}>Comments</Text>
                <Text style={styles.th}>Impr.</Text>
              </View>
              {topPosts.map((p, i) => {
                const pl = p.platforms?.find((x) => x.analytics)?.analytics ?? p.analytics;
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.tr,
                      { borderBottomWidth: i < topPosts.length - 1 ? 0.5 : 0, borderBottomColor: "#f3f4f6" },
                    ]}
                  >
                    <Text style={[styles.td, { flex: 3 }]}>{(p.content || "(no text)").slice(0, 80)}</Text>
                    <Text style={styles.td}>{metric(pl, "likes")}</Text>
                    <Text style={styles.td}>{metric(pl, "comments")}</Text>
                    <Text style={styles.td}>{fmt.format(metric(pl, "impressions"))}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {followers.length > 0 && (
          <>
            <Text style={styles.h2}>Follower growth</Text>
            <Text style={{ fontSize: 9, color: "#6b7280" }}>
              {followers.length} data points · {fmt.format(followers[followers.length - 1]?.followers ?? 0)}{" "}
              current followers
            </Text>
          </>
        )}

        <Text style={styles.footer}>
          Generated by Social Hub · Data from Zernio · {from} - {to}
        </Text>
      </Page>
    </Document>
  );

  const blob = await pdf(MyDocument).toBlob();
  return Buffer.from(await blob.arrayBuffer());
}
