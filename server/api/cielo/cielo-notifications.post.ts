export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    console.log('Notification Body -> ', body);
    return JSON.stringify(body);
  } catch (error) {
    console.error(error);
  }
});
