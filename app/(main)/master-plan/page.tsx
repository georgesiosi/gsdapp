// app/(main)/master-plan/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Import useToast from hooks
import { useEditor, EditorContent } from '@tiptap/react'; // Tiptap imports
import StarterKit from '@tiptap/starter-kit'; // Tiptap basic extensions
import { PageIntro } from '@/components/page-intro'; // Import PageIntro

// Basic Toolbar Component (can be styled further or replaced with Shadcn components)
const MenuBar = ({ editor }: { editor: any | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md p-2 mb-4 flex gap-2 flex-wrap">
      <Button
        variant={editor.isActive('bold') ? 'default' : 'outline'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        aria-pressed={editor.isActive('bold')}
      >
        Bold
      </Button>
      <Button
         variant={editor.isActive('italic') ? 'default' : 'outline'}
         size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        aria-pressed={editor.isActive('italic')}
      >
        Italic
      </Button>
      <Button
         variant={editor.isActive('bulletList') ? 'default' : 'outline'}
         size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-pressed={editor.isActive('bulletList')}
      >
        List
      </Button>
       <Button
         variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
         size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-pressed={editor.isActive('heading', { level: 2 })}
      >
        H2
      </Button>
      {/* Add more buttons as needed */}
    </div>
  );
};


export default function MasterPlanPage() {
  const userPreferences = useQuery(api.userPreferences.getUserPreferences);
  const updateMasterPlanText = useMutation(api.userPreferences.updateMasterPlanText); // Make sure this mutation exists after running `npx convex dev`

  const { toast } = useToast(); // Call useToast hook

  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit, // Includes paragraph, bold, italic, headings, lists etc.
    ],
    content: '', // Initial content set via useEffect
    editorProps: {
      attributes: {
        // Apply Tailwind typography and basic styling for the editor area
        class: 'prose dark:prose-invert max-w-none focus:outline-none border rounded-md min-h-[400px] p-4',
      },
    },
    // Update internal state or trigger auto-save on change if desired
    // onUpdate: ({ editor }) => {
    //   console.log(editor.getHTML());
    // },
  });

  useEffect(() => {
    // Set initial content when preferences load and editor is ready
    if (userPreferences && editor && !editor.isDestroyed) {
      const currentContent = editor.getHTML();
      const newContent = userPreferences.masterPlanText || '';
      // Avoid resetting content if it's the same or if user is editing
      if (newContent !== currentContent) {
         // Check if editor is focused to potentially avoid overwriting during typing
         // This check isn't foolproof but helps in some scenarios.
         // A more robust solution might involve debouncing or comparing JSON states.
         if (!editor.isFocused) {
            editor.commands.setContent(newContent, false); // Set content without emitting update event
         }
      }
    }
    // Dependency array includes userPreferences and editor instance
  }, [userPreferences, editor]);


  const handleSave = async () => {
    if (!editor) return;

    setIsSaving(true);
    const htmlContent = editor.getHTML(); // Get content as HTML
    try {
      // Ensure updateMasterPlanText is available before calling
      if (updateMasterPlanText) {
         await updateMasterPlanText({ masterPlanText: htmlContent });
         // Use shadcn/ui toast format
         toast({
           title: "Success",
           description: "Master Plan updated successfully!",
         });
      } else {
         // This might happen if convex dev hasn't run yet after adding the mutation
         console.error("updateMasterPlanText mutation is not available. Ensure convex types are generated.");
         // Use shadcn/ui toast format
         toast({
           variant: "destructive",
           title: "Error",
           description: "Save function not ready. Please wait or refresh.",
         });
      }
    } catch (error) {
      console.error("Failed to update master plan:", error);
      // Use shadcn/ui toast format
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update Master Plan. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup editor instance on component unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (userPreferences === undefined) {
    return <div className="container mx-auto p-4 md:p-8">Loading Master Plan...</div>;
  }

  const pageDescription = "Use this space to outline your overarching goals and vision. This plan can help guide your daily focus and priorities.";

  return (
    <div>
      <PageIntro showBackButton={true} />
      <h1 className="text-3xl font-bold tracking-tight mb-2">My Master Plan</h1>
      <p className="text-sm text-muted-foreground mb-6">{pageDescription}</p>
      
      <div className="flex-1 overflow-y-auto">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
        <Button onClick={handleSave} disabled={isSaving || !editor} className="mt-4">
          {isSaving ? "Saving..." : "Save Master Plan"}
        </Button>
      </div>
    </div>
  );
}
