import React, { useEffect, useState } from "react";
import { Link, Switch } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  List,
  message,
  PageHeader,
  Space,
  Typography,
} from "antd";
import {
  CloseCircleTwoTone,
  CheckCircleTwoTone,
  EyeOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import axios from "axios";
import moment from "moment";
import md5 from "js-md5";
import { Base64 as base64 } from "js-base64";

const VERSION = "V 2.5.6";

const getRandom = (n, m) => Math.floor(Math.random() * (m - n + 1)) + n;

const getNearLoc = (loc, limit = 1000) =>
  parseFloat(loc) + getRandom(-1 * limit, limit) / limit / 10000000;

const getList = (pageNum) =>
  new Promise((resolve, reject) => {
    const startTime = moment().subtract(720, "days").valueOf();
    const endTime = moment().valueOf();
    axios
      .post("running/api/v1/running/recordList", {
        pageNum,
        pageSize: 100,
        startTime,
        endTime,
      })
      .then((res) => {
        resolve(res.items);
      })
      .catch(() => {
        reject("获取列表失败");
      });
  });

const getUser = () =>
  new Promise((resolve, reject) => {
    axios
      .get("/health/api/v1/homePage/user")
      .then((res) => {
        const {
          runningRule: { rule, userCampus },
        } = res;
        //{rule:{},userCampus:{}}
        resolve({
          rule,
          userCampus,
        });
      })
      .catch(() => {
        reject(false);
      });
  });

const getStart = (campusId, orgId) =>
  new Promise((resolve, reject) => {
    const loc = {};
    switch (orgId) {
      case 368:
        loc.latitude = `30.786842${getRandom(10000, 99999)}`;
        loc.longitude = `103.886128${getRandom(10000, 99999)}`;
        break;
      case 53:
        loc.latitude = `30.826795${getRandom(10000, 99999)}`;
        loc.longitude = `104.18535${getRandom(10000, 99999)}`;
        break;
      case 444:
        loc.latitude = `30.82454${getRandom(10000, 99999)}`;
        loc.longitude = `106.118579${getRandom(10000, 99999)}`;
        break;
      case 386:
        loc.latitude = `30.728711${getRandom(10000, 99999)}`;
        loc.longitude = `103.965401${getRandom(10000, 99999)}`;
        break;
      case 418:
        loc.latitude = `30.764069${getRandom(10000, 99999)}`;
        loc.longitude = `103.985006${getRandom(10000, 99999)}`;
        break;
      default:
        return reject(false);
    }
    const data = Object.assign(
      {},
      {
        campusId,
        type: 1,
      },
      {
        ...loc,
      }
    );
    axios
      .post("/running/api/v1/running/start", { ...data })
      .then((res) => {
        const { randomCircuit } = res;
        //{...randomCircuit}
        resolve({ ...randomCircuit });
      })
      .catch(() => {
        reject(false);
      });
  });
const getEnd = (circuitString = {}, distance = 0, time = 0, path) =>
  new Promise((resolve, reject) => {
    //circuitString = { runningRule, randomCircuit }
    //{runningRule:{rule:{},userCampus:{}},randomCircuit:{}}
    const _circuitString = {
      ...circuitString,
      time: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    const data = {
      circuitInfo: {
        circuitString: JSON.stringify(_circuitString),
      },
      version: VERSION,
      valid: 1,
      id: 1,
      type: 1,
      platform: 1,
      stepRate: getRandom(40, 80),
      invalidReason: "",
      distance: distance,
      validDistance: distance,
      phone: "",
      startTime: moment().valueOf(),
      endTime: moment().add(time, "seconds").valueOf(),
      calories: parseInt(distance / 20),
      totalTime: time,
    };
    let latitudeArr = [],
      longitudeArr = [],
      speedArr = [],
      segment = [];
    const { requireLatitude, requireLongitude } = _circuitString.randomCircuit;
    if (!path) {
      for (let i = 0; i < 3; i++) {
        latitudeArr.push(requireLatitude[i]);
        longitudeArr.push(requireLongitude[i]);
        speedArr.push(getRandom(2, 20));
      }
      latitudeArr = [latitudeArr];
      longitudeArr = [longitudeArr];
      segment = [
        [
          data.startTime + getRandom(10, 100),
          data.endTime - getRandom(1500, 2500),
        ],
      ];
    } else {
      const _path = JSON.parse(base64.decode(path));
      latitudeArr = _path.latitude.map((i) =>
        Array.isArray(i) ? i.map((j) => getNearLoc(j)) : getNearLoc(i)
      );
      longitudeArr = _path.longitude.map((i) =>
        Array.isArray(i) ? i.map((j) => getNearLoc(j)) : getNearLoc(i)
      );
      speedArr = _path.speed.map((i) =>
        Array.isArray(i) ? i.map(() => getRandom(2, 20)) : i
      );
      const speedConfig = {
        avg: data.totalTime / speedArr.length,
        start: 0,
      };
      for (let i of latitudeArr) {
        const _segment = [];
        if (Array.isArray(i)) {
          for (let index = 0; index < i.length - 1; index++) {
            speedConfig.start += speedConfig.avg + getRandom(-10, 10);
            _segment.push(moment().add(speedConfig.start, "seconds").valueOf());
          }
          segment.push(_segment);
        }
      }
    }

    data.circuitInfo = {
      ...data.circuitInfo,
      latitude: latitudeArr,
      longitude: longitudeArr,
      segment: segment,
      speed: speedArr,
      calories: parseInt(distance / 20),
    };
    data.md5 = md5(
      `EndRunningInfo{a='${data.invalidReason}', b=${data.totalTime}, c=${data.distance}, d=${data.type}, e=${data.startTime}, f=${data.endTime}, g='${data.phone}'}`
    );
    const _data = {};
    Object.keys(data)
      .sort()
      .map((item) => (_data[item] = data[item]));
    axios
      .post(`/running/api/v1/running/end3`, _data)
      .then((res) => {
        resolve(res);
      })
      .catch(() => {
        reject(false);
      });
  });

function Home() {
  const [list, setList] = useState([]);

  const { loading, run } = useRequest(
    (obj) => {
      return new Promise(async (resolve, reject) => {
        //判断是否有导入路线
        const { distance, time, path } = obj;

        //获取用户信息
        const runningRule = await getUser().catch(() =>
          reject("获取用户信息失败")
        );
        //获取跑步信息
        const randomCircuit = await getStart(
          runningRule.rule.campusId,
          runningRule.rule.orgId
        ).catch(() => reject("获取跑步信息失败"));

        //提交跑步信息
        const end = await getEnd(
          { runningRule, randomCircuit },
          distance,
          time,
          path
        ).catch((e) => {
          reject(`结束跑步失败${e.message}`);
        });
        const { invalidReason, valid } = end;
        if (valid === 1) resolve(true);
        else reject(invalidReason);
      });
    },
    {
      manual: true,
      onSuccess: () => {
        message.success("跑步完成");
        listRun();
      },
      onError: (e) => {
        message.error(e);
        listRun();
      },
    }
  );

  const { loading: listLoading, run: listRun } = useRequest(() => getList(1), {
    manual: true,
    onSuccess: (res) => {
      setList(res);
    },
    onError: (e) => {
      message.error(e);
    },
  });

  useEffect(() => {
    listRun();
    getUser();
  }, []); //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader
        title="乐健"
        subTitle="完全免费"
        extra={
          <Link to="/login">
            <Button type="link">切换账号</Button>
          </Link>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Card title="告知" extra={<b>最后更新 2021/03/24</b>}>
            <Typography.Text>
              1.本功能属于纯前端实现，不存在收集，保留用户信息等
              <br />
            </Typography.Text>
            <Typography.Text>
              2.仅供学习研究使用，切勿用于非法或商业等用途
              <br />
            </Typography.Text>
            <Typography.Text>
              3.完全免费开源，请勿上当受骗，如果你是收费看到页面，请及时举报诈骗者
              <br />
            </Typography.Text>
            <Typography.Text>
              4.github:
              <a href="https://github.com/jwjjgs/sport_jwjjgs_cn">
                点我查看开源代码/更新日志
              </a>
              <br />
            </Typography.Text>
          </Card>
          <Card title="功能">
            <Form
              onFinish={(e) => {
                run(e);
              }}
            >
              <Form.Item name="path">
                <Input addonBefore="轨迹" placeholder="请粘贴导出轨迹(选填)" />
              </Form.Item>
              <Form.Item name="distance">
                <Input addonBefore="距离" addonAfter="米" />
              </Form.Item>
              <Form.Item name="time">
                <Input addonBefore="时间" addonAfter="秒" />
              </Form.Item>
              <Form.Item>
                <Button
                  htmlType="submit"
                  type="primary"
                  block
                  loading={loading}
                >
                  奔跑
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <List
            loading={listLoading}
            itemLayout="horizontal"
            dataSource={list}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.valid === 1 ? (
                      <CheckCircleTwoTone twoToneColor="#52c41a" />
                    ) : (
                      <CloseCircleTwoTone twoToneColor="#eb2f96" />
                    )
                  }
                  title={`距离:${item.validDistance}米 时间:${
                    item.totalTime >= 60 && parseInt(item.totalTime / 60) + "分"
                  }${(item.totalTime % 60) + "秒"}`}
                  description={item.startTime}
                />
                <Link
                  to={{
                    pathname: "/map",
                    state: {
                      circuitInfo: JSON.parse(item.circuitInfo),
                    },
                  }}
                >
                  <Button icon={<EyeOutlined />} type="link"></Button>
                </Link>
              </List.Item>
            )}
          />
        </Space>
      </PageHeader>
    </>
  );
}
export default Home;
