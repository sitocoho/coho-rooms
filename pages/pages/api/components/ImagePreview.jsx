export default function ImagePreview({ file }) {
  if(!file) return null
  return (
    <div style={{marginTop:8}}>
      <img src={file.dataUrl} alt={file.name} style={{maxWidth:200, maxHeight:200, border:'1px solid #ccc', borderRadius:4}} />
      <div>{file.name}</div>
    </div>
  )
}
