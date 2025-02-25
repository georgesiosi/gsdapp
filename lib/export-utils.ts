interface ExportableGoal {
  goal: string
  priority: string
  completed: boolean
  lastModified: string
}

interface ExportableTask {
  id: string
  text: string
  quadrant: string
  completed: boolean
}

export function convertToCSV<T extends Record<string, unknown>>(data: T[], headers: string[]): string {
  const csvRows = []
  
  // Add headers
  csvRows.push(headers.join(','))
  
  // Add data rows
  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header.toLowerCase()]
      // Handle special cases like booleans and strings with commas
      if (typeof value === 'boolean') return value ? 'true' : 'false'
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`
      return value ?? ''
    })
    csvRows.push(values.join(','))
  })
  
  return csvRows.join('\n')
}

export function exportGoalsToCSV(): void {
  try {
    const savedData = localStorage.getItem('goalData')
    if (!savedData) return

    const goalData = JSON.parse(savedData) as ExportableGoal
    const headers = ['Goal', 'Priority', 'Completed', 'LastModified']
    const csvContent = convertToCSV([goalData], headers)
    
    downloadCSV(csvContent, 'my-goals.csv')
  } catch (error) {
    console.error('Error exporting goals:', error)
  }
}

export function exportTasksToCSV(): void {
  try {
    const savedTasks = localStorage.getItem('tasks')
    if (!savedTasks) return

    const tasks = JSON.parse(savedTasks) as ExportableTask[]
    const headers = ['Id', 'Text', 'Quadrant', 'Completed']
    const csvContent = convertToCSV(tasks, headers)
    
    downloadCSV(csvContent, 'my-tasks.csv')
  } catch (error) {
    console.error('Error exporting tasks:', error)
  }
}

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
