// trainerMockService.js
// ⚠️ TEMPORARY MOCK SERVICE for Trainer Management.
// Isolate trainer data until the Trainer backend module is fully implemented.

let trainers = [
  { id: 1, name: 'Dr. Ava Thompson', email: 'ava.thompson@hexaware.com', expertise: 'Java Enterprise', workload: 85, rating: 4.9, batches: ['Batch B21', 'Batch B22'], courses: ['Core Java Foundations', 'Java Microservices'], attendance: '98%', students: 45, comments: 'Extremely professional and highly rated by students.' },
  { id: 2, name: 'Prof. Noah Parker', email: 'noah.parker@hexaware.com', expertise: 'Python & AI', workload: 92, rating: 4.8, batches: ['Batch B25', 'Batch B26'], courses: ['Python for Data Analysis', 'Machine Learning'], attendance: '95%', students: 60, comments: 'Thorough explanations, highly academic yet practical.' },
  { id: 3, name: 'Dr. Mason Cooper', email: 'mason.cooper@hexaware.com', expertise: 'Database Systems', workload: 70, rating: 4.7, batches: ['Batch B20'], courses: ['SQL & DBMS Essentials'], attendance: '97%', students: 30, comments: 'Very interactive sessions, reviews student code regularly.' },
  { id: 4, name: 'Amelia Scott', email: 'amelia.scott@hexaware.com', expertise: 'React Frontend', workload: 60, rating: 4.6, batches: ['Batch B24'], courses: ['React Frontend Advanced'], attendance: '92%', students: 28, comments: 'Good project guidance, nice hands-on exercises.' }
];

const trainerMockService = {
  getTrainers() {
    const stored = localStorage.getItem('mock_trainers');
    if (stored) {
      trainers = JSON.parse(stored);
    }
    return [...trainers];
  },

  saveTrainers(newTrainers) {
    trainers = [...newTrainers];
    localStorage.setItem('mock_trainers', JSON.stringify(trainers));
    return trainers;
  },

  getTrainerById(id) {
    const list = this.getTrainers();
    return list.find(t => t.id === Number(id));
  },

  searchTrainers(keyword) {
    const list = this.getTrainers();
    return list.filter(t => 
      t.name.toLowerCase().includes(keyword.toLowerCase()) ||
      t.email.toLowerCase().includes(keyword.toLowerCase()) ||
      t.expertise.toLowerCase().includes(keyword.toLowerCase())
    );
  }
};

export default trainerMockService;
