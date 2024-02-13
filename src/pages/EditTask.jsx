import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { url } from '../const';
import { useNavigate, useParams } from 'react-router-dom';
import './editTask.scss';

export const EditTask = () => {
  const navigate = useNavigate();
  const { listId, taskId } = useParams();
  const [cookies] = useCookies();
  const [title, setTitle] = useState('');
  const [limit, setLimit] = useState(''); // 期限のstateを追加
  const [detail, setDetail] = useState('');
  const [isDone, setIsDone] = useState();
  const [errorMessage, setErrorMessage] = useState('');
  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDetailChange = (e) => setDetail(e.target.value);
  const handleIsDoneChange = (e) => setIsDone(e.target.value === 'done');
  const handleLimitChange = (e) => setLimit(e.target.value); // 追加
  
  const onUpdateTask = () => {
    // 送信時にフォーマットを整える
    const formattedDateTime = limit ? new Date(limit).toISOString() : '';
    console.log(isDone);
    const data = {
      title: title,
      limit: formattedDateTime,
      detail: detail,
      done: isDone,
    };

    axios
      .put(`${url}/lists/${listId}/tasks/${taskId}`, data, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        console.log(res.data);
        navigate('/');
      })
      .catch((err) => {
        setErrorMessage(`更新に失敗しました。${err}`);
      });
  };

  const onDeleteTask = () => {
    axios
      .delete(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        setErrorMessage(`削除に失敗しました。${err}`);
      });
  };

  
    
  // APIから期限の取得
  useEffect(() => {
    axios
      .get(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        const task = res.data;
        setTitle(task.title);

        // タイムゾーンの差を考慮して初期値にセット
        const localLimit = task.limit ? new Date(task.limit) : null;

        // フォーマットを "yyyy-MM-ddThh:mm" に変換
        const formattedLocalLimit = localLimit
        ? `${localLimit.getFullYear()}-${String(localLimit.getMonth() + 1).padStart(2, '0')}-${String(localLimit.getDate()).padStart(2, '0')}T${String(localLimit.getHours()).padStart(2, '0')}:${String(localLimit.getMinutes()).padStart(2, '0')}`
        : '';

        setLimit(formattedLocalLimit);
        setDetail(task.detail);
        setIsDone(task.done);
      })
      .catch((err) => {
        setErrorMessage(`タスク情報の取得に失敗しました。${err}`);
      });
  }, []);



  return (
    <div>
      <Header />
      <main className="edit-task">
        <h2>タスク編集</h2>
        <p className="error-message">{errorMessage}</p>
        <form className="edit-task-form">
          <label>タイトル</label>
          <br />
          <input type="text" onChange={handleTitleChange} className="edit-task-title" value={title} />
          <br />
          <label>期日</label>
          <br />
          <input type="datetime-local" value={limit} onChange={handleLimitChange} className="new-task-title" />
          <br />
          <label>詳細</label>
          <br />
          <textarea type="text" onChange={handleDetailChange} className="edit-task-detail" value={detail} />
          <br />
          <div>
            <input
              type="radio"
              id="todo"
              name="status"
              value="todo"
              onChange={handleIsDoneChange}
              checked={isDone === false ? 'checked' : ''}
            />
            未完了
            <input
              type="radio"
              id="done"
              name="status"
              value="done"
              onChange={handleIsDoneChange}
              checked={isDone === true ? 'checked' : ''}
            />
            完了
          </div>
          <button type="button" className="delete-task-button" onClick={onDeleteTask}>
            削除
          </button>
          <button type="button" className="edit-task-button" onClick={onUpdateTask}>
            更新
          </button>
        </form>
      </main>
    </div>
  );
};
