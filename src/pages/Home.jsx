import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';
import { calculateRemainingTime } from '../remainingTimeUtils'; // 追加

// 時間を日本語形式にフォーマットする関数
const displayJapaneseTime = (time) => {
  const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
  return new Date(time).toLocaleString('ja-JP', options);
};

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo'); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== 'undefined') {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter' && id > -1) {
      handleSelectList(lists[id].id);
    }
  };

  // 表示するタスク
  const Tasks = (props) => {
    const { tasks, selectListId, isDoneDisplay } = props;

    if (tasks === null) return <></>;

    if (isDoneDisplay === 'done') {
      return (
        <ul>
          {tasks
            .filter((task) => {
              return task.done === true;
            })
            .map((task, key) => (
              <li key={key} className="task-item">
                <Link 
                  to={`/lists/${selectListId}/tasks/${task.id}`}
                  className="task-item-link"
                >
                  {task.title}
                  <br />
                  {task.done ? '完了' : '未完了'}
                  <br />
                  {<RemainingTime limit={task.limit} />}
                </Link>
              </li>
            ))}
        </ul>
      );
    }

    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === false;
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={{
                  pathname: `/lists/${selectListId}/tasks/${task.id}`,
                  state: { deadline: task.limit },
                }}
                className="task-item-link"
              >
                {task.title}
                <br />
                {task.done ? '完了' : '未完了'}
                <br />
                {<RemainingTime limit={task.limit} />}
              </Link>
            </li>
          ))}
      </ul>
    );
  };

  Tasks.propTypes = {
    tasks: PropTypes.array,
    selectListId: PropTypes.string,
    isDoneDisplay: PropTypes.string.isRequired,
  };
  
  // 残り時間を表示するコンポーネント
  const RemainingTime = (props) => {
    const { limit } = props;
    const [remainingTime, setRemainingTime] = useState({});
    const [japaneseTime, setJapaneseTime] = useState('');

    useEffect(() => {
      // 初回の計算
     const initialRemainingTime = calculateRemainingTime(limit);
     setRemainingTime(initialRemainingTime);
      setJapaneseTime(displayJapaneseTime(limit)); // 日本時間に変換してセット

      // 1分ごとに更新
     const intervalId = setInterval(() => {
        const remainingTime = calculateRemainingTime(limit);
        setRemainingTime(remainingTime);
        
        setJapaneseTime(displayJapaneseTime(limit)); // 日本時間に変換してセット
      }, 60000); 

      return () => clearInterval(intervalId); // コンポーネントがアンマウントされるときにクリーンアップ
    }, [limit]);

    return (
      <div>
        <p className="japanese-time">
          期限日時： {japaneseTime}
        </p>
        <p className="remaining-time">
          残り時間： {`${remainingTime.days}日 ${remainingTime.hours}時間 ${remainingTime.minutes}分`}
        </p>
      </div>
    );
  };

  RemainingTime.propTypes = {
    limit: PropTypes.string.isRequired,
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>選択中のリストを編集</Link>
              </p>
            </div>
          </div>
          <ul 
            className="list-tab"
            role="tablist" // リストがタブリストであることを示す
            aria-label="リスト一覧" // タブリストのラベル
          >
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectList(list.id)}
                  role="tab" // 各リストアイテムがタブであることを示す  不要？
                  tabIndex={0} // タブリスト内でフォーカスを受ける順序を設定
                  aria-selected={isActive ? 'true' : 'false'} // アクティブなタブを示す  不要？
                  aria-controls={`list-${key}`} // タブが関連するパネルのID  不要？
                  onKeyDown={(e) => handleKeyDown(e, key)} // 追加：Enterキーで選択可能に
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select onChange={handleIsDoneDisplayChange} className="display-select">
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks 
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
              aria-labelledby="displaySelect" // 選択中のタブと関連付ける
            />
          </div>
        </div>
      </main>
    </div>
  );
};