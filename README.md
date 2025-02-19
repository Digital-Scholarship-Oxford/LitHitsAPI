# LitHits API

# Client-Side API Documentation

## Installation

You need to add the following API link in your HTML file

```
<script src="https://digital-scholarship-oxford.github.io/LitHitsAPI/js/api.js"></script>
```

## Methods

### `loadData(file)`
Loads data from a specified file and parses it.

**Parameters:**
- `file` (string): The name of the file to load from the server.

**Returns:**
- A `Promise` that resolves when the data is successfully loaded and parsed, or rejects with an error if the request fails.

**Usage:**
```javascript
try {
    await loadData('your-file-name');
    console.log('Data loaded and parsed.');
} catch (error) {
    console.error('Error loading data:', error);
}
```

### `getAllTags(duration)`
Fetches a list of unique tags for a given duration.

**Parameters:**
- `duration` (string): The duration to filter tags.

**Returns:**
- An array of strings containing all unique tags for the given duration.

**Usage:**
```javascript
try {
    const tags = await getAllTags('5');
    console.log('Tags:', tags);
} catch (error) {
    console.error('Error fetching tags:', error);
}
```

### `getText(duration, tags)`
Fetches a list of IDs based on the given duration and optional tags filter.

**Parameters:**
- `duration` (string): The duration value (e.g., minutes 5, 10 etc...) to filter the data.
- `tags` (string): (array of strings, optional): An array of tags to further filter the data.

**Returns:**
- An array of IDs (strings) matching the query filter.

**Usage:**
```javascript
try {
    const ids = await getText('short', ['alcohol', 'science']);
    console.log('Found IDs:', ids);
} catch (error) {
    console.error('Error fetching text:', error);
}
```
### `getTitleById(id)`
Fetches the title for a specific ID.

**Parameters:**
- `id` (string): The identifier of the resource to retrieve the title for.

**Returns:**
- A string containing the title of the resource.

**Usage:**
```javascript
try {
    const title = await getTitleById('some-id');
    console.log('Title:', title);
} catch (error) {
    console.error('Error fetching title:', error);
}
```
### `getContentFromFileById(id)`
Fetches the content of a text file by its ID.

**Parameters:**
- `id` (string): The identifier of the text file to retrieve.

**Returns:**
- A string containing the content of the text file, or a fallback message 'No text file found.' if the file is not found.

**Usage:**
```javascript
try {
    const content = await getContentFromFileById('some-id');
    console.log('File Content:', content);
} catch (error) {
    console.error('Error fetching file content:', error);
}  console.error('Error fetching title:', error);
```

### `getSurpriseText(duration)`
Fetches a random text based on a duration and randomly selected tags.

**Parameters:**
- `duration` (string): The duration to filter the data.

**Returns:**
- A string containing the text content, or a fallback message 'No text file found.' if no text is available.

**Usage:**
```javascript
try {
    const text = await getSurpriseText('10');
    console.log('Surprise Text:', text);
} catch (error) {
    console.error('Error fetching surprise text:', error);
}
```