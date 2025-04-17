export default function Uploader({ onSelect }: { onSelect: (file: File) => void }) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onSelect(file)
    }
  
    return (
      <div>
        <label className="block mb-1 text-sm font-medium">사진 업로드</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
        />
      </div>
    )
  }
  