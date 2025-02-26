// frontend/src/components/threads/NewThreadButton.tsx
import { useState, RefObject } from "react";
// import { useRouter } from "next/navigation";

interface NewThreadButtonProps {
  isLoggedIn: boolean;
  onSubmit: (title: string, body: string, category: string) => Promise<void>;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

const NewThreadButton = ({
  isLoggedIn,
  onSubmit,
  buttonRef,
}: NewThreadButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("General");
  //   const router = useRouter();

  if (!isLoggedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(title, body, category);
    setTitle("");
    setBody("");
    setCategory("General");
    setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isExpanded ? (
        <button
          ref={buttonRef}
          onClick={toggleExpand}
          className="new-thread-button bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center"
        >
          <span className="material-icons-outlined">add</span>
        </button>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-lg w-80 md:w-96">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-green-800">Create New Thread</h3>
            <button
              onClick={toggleExpand}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Thread Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 text-sm"
              required
            />
            <textarea
              placeholder="Wetin dey your mind?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 h-24 text-gray-800 text-sm"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 bg-white text-sm"
            >
              <option value="General">General</option>
              <option value="Gist">Gist</option>
              <option value="Politics">Politics</option>
              <option value="Romance">Romance</option>
            </select>
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 text-sm"
            >
              Post am!
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default NewThreadButton;
