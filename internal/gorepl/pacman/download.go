package pacman

type downloadCallback = func(p Progress)
type progressReader struct {
	total      int64
	downloaded int64
	cb         downloadCallback
}

func newProgressReader(total int64, cb downloadCallback) *progressReader {
	return &progressReader{total: total, cb: cb}
}

func (r *progressReader) Write(p []byte) (int, error) {
	n := len(p)
	r.downloaded += int64(n)
	r.cb(Progress{
		Total:   int(r.total),
		Current: int(r.downloaded),
	})
	return n, nil
}
