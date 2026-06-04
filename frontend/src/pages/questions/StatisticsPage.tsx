import React, { useEffect, useState } from "react";
import { Table, Tabs, Card, Typography, Spin } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

export function StatisticsPage() {
  const [data, setData] = useState<any>({
    topViews: [],
    topComments: [],
    topLikes: [],
  });
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu bảng xếp hạng
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/questions/stats/dashboard",
          {
            withCredentials: true,
          },
        );
        setData(res.data);
      } catch (err) {
        console.error("Failed to load leaderboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Hàm tiện ích để render cả biểu đồ và bảng xếp hạng cho mỗi Tab
  const renderContent = (
    dataSource: any[],
    dataKey: string,
    chartColor: string,
    columnTitle: string,
  ) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        marginTop: "16px",
      }}
    >
      <Card bordered={true} style={{ borderRadius: "4px" }}>
        <Typography.Title level={4}>Biểu đồ trực quan</Typography.Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={dataSource}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="title"
              tick={{ fontSize: 11 }}
              truncateByClip={true}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKey} fill={chartColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Table
        bordered
        dataSource={dataSource}
        rowKey="id"
        pagination={false}
        columns={[
          {
            title: "Thứ hạng",
            key: "rank",
            width: 100,
            align: "center",
            render: (_text, _record, index) => (
              <b style={{ fontSize: 16 }}>#{index + 1}</b>
            ),
          },
          { title: "Tiêu đề bài viết", dataIndex: "title", key: "title" },
          {
            title: columnTitle,
            dataIndex: dataKey,
            key: dataKey,
            width: 150,
            align: "center",
          },
        ]}
      />
    </div>
  );

  return (
    <div
      style={{ maxWidth: 1000, margin: "20px auto", fontFamily: "sans-serif" }}
    >
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        Bảng xếp hạng diễn đàn
      </Typography.Title>
      <Spin spinning={loading}>
        <Tabs defaultActiveKey="1" type="card">
          <Tabs.TabPane tab=" Lượt xem nhiều nhất" key="1">
            {renderContent(data.topViews, "viewCount", "#8884d8", "Lượt xem")}
          </Tabs.TabPane>
          <Tabs.TabPane tab=" Được thích nhiều nhất" key="2">
            {renderContent(data.topLikes, "score", "#82ca9d", "Điểm Vote")}
          </Tabs.TabPane>
          <Tabs.TabPane tab=" Thảo luận sôi nổi (Bình luận)" key="3">
            {renderContent(
              data.topComments,
              "commentsCount",
              "#ffc658",
              "Số bình luận",
            )}
          </Tabs.TabPane>
        </Tabs>
      </Spin>
    </div>
  );
}
