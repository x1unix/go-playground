package browserfs

import "github.com/x1unix/go-playground/pkg/util/mathx"

type fileType uint

const (
	fileTypeZero fileType = iota
	fileTypeRegular
	fileTypeDirectory
	fileTypeSymlink

	maxFileNameLen = 128
)

type sizedFileName struct {
	len  uint8
	data [maxFileNameLen]byte
}

func newSizedFileName(str string) sizedFileName {
	var data [maxFileNameLen]byte
	count := copy(data[:], str[:mathx.Min(
		maxFileNameLen, len(str),
	)])
	return sizedFileName{
		len:  uint8(count),
		data: data,
	}
}

func (n sizedFileName) string() string {
	nameLen := mathx.Min(n.len, maxFileNameLen)
	return string(n.data[:nameLen])
}

// inode contains IndexedDB fs entry attributes
type inode struct {
	id        uint64
	parentId  uint64
	fileType  fileType
	size      int64
	createdAt int64
	name      sizedFileName
}
