"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReasoningLogService, AIReasoningLog } from "@/services/ai/reasoningLogService"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

export default function AILogsPage() {
  const [logs, setLogs] = useState<AIReasoningLog[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  // Load logs on component mount
  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    try {
      const allLogs = ReasoningLogService.getAllLogs()
      setLogs(allLogs)
    } catch (error) {
      console.error("Error loading logs:", error)
      toast({
        title: "Error loading logs",
        description: "There was a problem loading the AI reasoning logs.",
        variant: "destructive",
      })
    }
  }

  const handleClearLogs = () => {
    try {
      ReasoningLogService.clearAllLogs()
      setLogs([])
      toast({
        title: "Logs cleared",
        description: "All AI reasoning logs have been cleared.",
      })
    } catch (error) {
      console.error("Error clearing logs:", error)
      toast({
        title: "Error clearing logs",
        description: "There was a problem clearing the AI reasoning logs.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLog = (logId: string) => {
    try {
      ReasoningLogService.deleteLog(logId)
      setLogs(logs.filter(log => log.taskId !== logId))
      toast({
        title: "Log deleted",
        description: "The AI reasoning log has been deleted.",
      })
    } catch (error) {
      console.error("Error deleting log:", error)
      toast({
        title: "Error deleting log",
        description: "There was a problem deleting the AI reasoning log.",
        variant: "destructive",
      })
    }
  }

  // Filter logs based on active tab
  const filteredLogs = logs.filter(log => {
    if (activeTab === "all") return true
    if (activeTab === "q1") return log.suggestedQuadrant === "q1"
    if (activeTab === "q2") return log.suggestedQuadrant === "q2"
    if (activeTab === "q3") return log.suggestedQuadrant === "q3"
    if (activeTab === "q4") return log.suggestedQuadrant === "q4"
    return true
  })

  // Sort logs by timestamp (newest first)
  const sortedLogs = [...filteredLogs].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">AI Reasoning Logs</h1>
        </div>
        <Button variant="destructive" onClick={handleClearLogs} disabled={logs.length === 0}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Logs
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="q1">Q1: Urgent & Important ({logs.filter(l => l.suggestedQuadrant === "q1").length})</TabsTrigger>
          <TabsTrigger value="q2">Q2: Important, Not Urgent ({logs.filter(l => l.suggestedQuadrant === "q2").length})</TabsTrigger>
          <TabsTrigger value="q3">Q3: Urgent, Not Important ({logs.filter(l => l.suggestedQuadrant === "q3").length})</TabsTrigger>
          <TabsTrigger value="q4">Q4: Not Urgent & Not Important ({logs.filter(l => l.suggestedQuadrant === "q4").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {sortedLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No logs found for this category.</p>
            </div>
          ) : (
            sortedLogs.map((log) => (
              <Card key={log.taskId} className="overflow-hidden">
                <CardHeader className={`
                  ${log.suggestedQuadrant === "q1" ? "bg-red-50 dark:bg-red-950/20" : ""}
                  ${log.suggestedQuadrant === "q2" ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                  ${log.suggestedQuadrant === "q3" ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                  ${log.suggestedQuadrant === "q4" ? "bg-green-50 dark:bg-green-950/20" : ""}
                `}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{log.taskText}</CardTitle>
                      <CardDescription>
                        {new Date(log.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteLog(log.taskId)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">AI Reasoning</h3>
                      <p className="text-sm text-muted-foreground">{log.reasoning}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <h4 className="text-xs font-medium mb-1">Alignment Score</h4>
                        <div className="text-lg font-semibold">{log.alignmentScore}/10</div>
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs font-medium mb-1">Urgency Score</h4>
                        <div className="text-lg font-semibold">{log.urgencyScore}/10</div>
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs font-medium mb-1">Importance Score</h4>
                        <div className="text-lg font-semibold">{log.importanceScore}/10</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 py-2">
                  <div className="text-xs text-muted-foreground">
                    Quadrant: {
                      log.suggestedQuadrant === "q1" ? "Q1: Urgent & Important" :
                      log.suggestedQuadrant === "q2" ? "Q2: Important, Not Urgent" :
                      log.suggestedQuadrant === "q3" ? "Q3: Urgent, Not Important" :
                      "Q4: Not Urgent & Not Important"
                    }
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
