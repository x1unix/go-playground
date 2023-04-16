package browserfs

import "github.com/x1unix/go-playground/pkg/util/mathx"

type fileType uint8

const (
	fileTypeZero fileType = iota
	fileTypeRegular
	fileTypeDirectory
	fileTypeSymlink

	maxFileNameLen = 128
)

// inode contains IndexedDB fs entry attributes
type inode struct {
	id        uint64
	parentId  uint64 //nolint:unused
	fileType  fileType
	size      int64
	createdAt int64
	name      sizedFileName
}

type sizedFileName struct {
	len  uint8
	data [maxFileNameLen]byte
}

func (n sizedFileName) string() string {
	nameLen := mathx.Min(n.len, maxFileNameLen)
	return string(n.data[:nameLen])
}
