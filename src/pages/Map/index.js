import { Button, message, PageHeader } from "antd";
import React, { useEffect, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { ShareAltOutlined } from "@ant-design/icons";
import copy from "copy-to-clipboard";
import { Base64 as base64 } from "js-base64";

function Map(props) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    try {
      //得到传入数据
      const {
        location: {
          state: {
            circuitInfo: { longitude, latitude, speed },
          },
        },
      } = props;
      setInfo({ longitude, latitude, speed });
      //将传入数据 longitude = [[...],[...],...]  ... 转为一维数组
      const combine = (arr, i) => {
        if (Array.isArray(i)) arr.push(...i);
        else arr.push(i);
        return arr;
      };
      const longitude_ = longitude.reduce(combine, []);
      const latitude_ = latitude.reduce(combine, []);

      //将两个一维数组转字符串[]
      const coords = [];
      for (let i = 0; i < longitude_.length; i++)
        coords.push([longitude_[i], latitude_[i]]);
      if (coords.length > 0) {
        AMapLoader.load({
          key: "3f3868abdb36336114bde5ab6eecdb68", // 申请好的Web端开发者Key，首次调用 load 时必填
          plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
        })
          .then((AMap) => {
            const map = new AMap.Map("map", {
              center: coords[0],
              zoom: 17,
            });
            const polyline = new AMap.Polyline({
              path: coords, //设置线覆盖物路径
              strokeColor: "#3366FF", //线颜色
              strokeWeight: 3, //线宽
              strokeStyle: "solid", //线样式
            });
            map.add(polyline);
          })
          .catch((e) => {
            console.log(e);
          });
      }
    } catch {}
  }, [props]);
  return (
    <>
      <PageHeader
        title="轨迹显示"
        onBack={() => {
          props.history.push("/");
        }}
        extra={[
          <Button
            key="export"
            type="link"
            icon={<ShareAltOutlined />}
            onClick={() => {
              try {
                if (!info) {
                  message.warning("导出失败");
                  return;
                }
                const str = JSON.stringify(info);
                copy(base64.encode(str));
                message.success("导出成功");
              } catch {
                message.warning("导出失败");
              }
            }}
          ></Button>,
        ]}
      />
      <div
        style={{
          height: "100vh",
          paddingTop: "72px",
          marginTop: "-72px",
        }}
      >
        <div id="map" style={{ height: "100%" }}></div>
      </div>
    </>
  );
}

export default Map;
