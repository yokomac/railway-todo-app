import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';
import { calculateRemainingTime } from '../remainingTimeUtils'; // 追加

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
    if (e.key === 'ArrowLeft' && id > 0) {
      handleSelectList(lists[id - 1].id);
    } else if (e.key === 'ArrowRight' && id < lists.length - 1) {
      handleSelectList(lists[id + 1].id);
    }
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
            onKeyDown={(e) => handleKeyDown(e, lists.findIndex((list) => list.id === selectListId))}
          >
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectList(list.id)}
                  role="tab" // 各リストアイテムがタブであることを示す
                  tabIndex={0} // タブリスト内でフォーカスを受ける順序を設定
                  aria-selected={isActive ? 'true' : 'false'} // アクティブなタブを示す
                  aria-controls={`list-${key}`} // タブが関連するパネルのID
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
              <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
                {task.title} {task.limit} 
                <br />
                {task.done ? '完了' : '未完了'}
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
            <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
              {task.title} {task.limit}
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

  useEffect(() => {
    // 初回の計算
    const initialRemainingTime = calculateRemainingTime(limit);
    setRemainingTime(initialRemainingTime);

    // 1分ごとに更新
    const intervalId = setInterval(() => {
      const remainingTime = calculateRemainingTime(limit);
      setRemainingTime(remainingTime);
    }, 60000); 

    // コンポーネントがアンマウントされるときにクリーンアップ
    return () => clearInterval(intervalId);
  }, [limit]);

  return (
    <p className="remaining-time">
      残り時間: {`${remainingTime.days}日 ${remainingTime.hours}時間 ${remainingTime.minutes}分`}
    </p>
  );
};

RemainingTime.propTypes = {
  limit: PropTypes.string.isRequired,
};