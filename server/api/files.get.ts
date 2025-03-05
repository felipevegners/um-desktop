type fileName = {
    name: string;
};
export default defineEventHandler(async (event) => {
    const query = getQuery<fileName>(event);
    const file = await getFilesLocally(query.name);
    return file;
});
