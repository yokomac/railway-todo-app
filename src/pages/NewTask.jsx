import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { url } from '../const';
import { Header } from '../components/Header';
import './newTask.scss';
import { useNavigate } from 'react-router-dom'; //追加

export const NewTask = () => {
  const [selectListId, setSelectListId] = useState();
  const [lists, setLists] = useState([]);
  const [title, setTitle] = useState('');
  const [limit, setLimit] = useState(''); // 新しいローカルステート
  const [detail, setDetail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();
  const navigate = useNavigate();

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDetailChange = (e) => setDetail(e.target.value);
  const handleSelectList = (id) => setSelectListId(Number(id));
  // limitステートを更新するためのハンドラを追加
  // handleLimitChange関数を更新して、limitステートをフォーマットする
  const handleLimitChange = (e) => {
    const selectedDateTime = e.target.value;
    const formattedDateTime = new Date(selectedDateTime.replace('T', ' ')).toISOString();
    setLimit(formattedDateTime);
  };
  

  const onCreateTask = () => {
    const data = {
      title: title,
      limit: limit, // ローカルステートを使用する
      detail: detail,
      done: false,
    };

    if (!limit) { // 期限日時が空の場合はエラーメッセージを設定
      setErrorMessage('期限日時は必須です。');
      return;
    }

    axios
      .post(`${url}/lists/${selectListId}/tasks`, data, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then(() => {
        // タスクの作成が成功したら、Home ページに遷移
       navigate('/');
      })
      .catch((err) => {
        setErrorMessage(`タスクの作成に失敗しました。${err}`);
      });
  };

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
        setSelectListId(res.data[0]?.id);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, [cookies.token]);

  return (
    <div>
      <Header />
      <main className="new-task">
        <h2>タスク新規作成</h2>
        <p className="error-message">{errorMessage}</p>
        <form className="new-task-form">
          <label>リスト</label>
          <br />
          <select onChange={(e) => handleSelectList(e.target.value)} className="new-task-select-list">
            {lists.map((list, key) => (
              <option key={key} className="list-item" value={list.id}>
                {list.title}
              </option>
            ))}
          </select>
          <br />
          <label>タイトル</label>
          <br />
          <input type="text" onChange={handleTitleChange} className="new-task-title" />
          <br />
          <label>期日</label>
          <br />
          <input type="datetime-local" id="timezone" name="timezone" value="+09:00" onChange={handleLimitChange} className="new-task-title" />
          <br />
          <label>詳細</label>
          <br />
          <textarea type="text" onChange={handleDetailChange} className="new-task-detail" />
          <br />
          <button type="button" className="new-task-button" onClick={onCreateTask}>
            作成
          </button>
        </form>
      </main>
    </div>
  );
};
