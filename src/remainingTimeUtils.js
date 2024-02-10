export const calculateRemainingTime = (limit) => {
  const currentTime = new Date();
  const deadlineTime = new Date(limit);
  const timeDifference = deadlineTime - currentTime;

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

  console.log('Days:', days);
  console.log('Hours:', hours);
  console.log('Minutes:', minutes);
  return { days, hours, minutes };
};