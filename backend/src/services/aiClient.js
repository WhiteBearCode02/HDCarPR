import axios from 'axios';

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL,
  timeout: 5000
});

export async function inferFuelDiagnosis(payload) {
  const { data } = await aiClient.post('/infer', payload);
  return data;
}
